import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { type Order } from "@/lib/services/orderService";
import { useState } from "react";
import { ArrowUpDown, Send } from "lucide-react";
import jsPDF from "jspdf";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

function OrderActions({ order }: { order: Order }) {
    const [open, setOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const [customerName, setCustomerName] = useState(order.customer_name || "");
    const [includePDF, setIncludePDF] = useState(false);

    const generatePDF = () => {
        const doc = new jsPDF({
            format: 'a6',
            orientation: 'portrait'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        // Header
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("DuStore", centerX, 15, { align: "center" });

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Jl. Contoh Raya No. 123, Jakarta", centerX, 20, { align: "center" });
        doc.text("Telp: 0812-3456-7890", centerX, 24, { align: "center" });

        doc.line(10, 28, pageWidth - 10, 28);

        // Order Info
        doc.setFontSize(9);
        doc.text(`Order ID: #${order.id.toString().padStart(3, '0')}`, 10, 35);
        const dateStr = order.created_at ? new Date(order.created_at).toLocaleString() : "-";
        doc.text(`Tgl: ${dateStr}`, 10, 40);
        doc.text(`Cust: ${customerName}`, 10, 45);

        // Items
        let yPos = 55;

        // Custom simple table for receipt look
        doc.setFont("helvetica", "bold");
        doc.text("Item", 10, yPos);
        doc.text("Qty", pageWidth - 40, yPos, { align: "right" });
        doc.text("Total", pageWidth - 10, yPos, { align: "right" });

        doc.line(10, yPos + 2, pageWidth - 10, yPos + 2);

        yPos += 7;
        doc.setFont("helvetica", "normal");

        order.order_items.forEach((item) => {
            doc.text(item.name, 10, yPos);
            doc.text(item.quantity.toString(), pageWidth - 40, yPos, { align: "right" });
            doc.text((item.price * item.quantity).toLocaleString('id-ID'), pageWidth - 10, yPos, { align: "right" });
            yPos += 5;
        });

        doc.line(10, yPos + 2, pageWidth - 10, yPos + 2);
        yPos += 8;

        // Total
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("TOTAL", 10, yPos);
        doc.text(`Rp ${order.total_price.toLocaleString('id-ID')}`, pageWidth - 10, yPos, { align: "right" });

        // Footer
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("Terima kasih atas kunjungan Anda!", centerX, yPos + 15, { align: "center" });

        doc.save(`Struk_${order.id.toString().padStart(3, '0')}.pdf`);
        return doc;
    };

    const handleSendWA = () => {
        if (!phone) {
            toast.error("Harap isi nomor WhatsApp");
            return;
        }

        if (includePDF) {
            generatePDF();
            toast.info("Struk PDF diunduh.");
        }

        // Format phone number
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }

        const itemsList = order.order_items
            .map(item => {
                const price = item.price.toLocaleString('id-ID');
                if (item.quantity > 1) {
                    return `- ${item.quantity}x ${item.name} (@ Rp ${price})`;
                }
                return `- ${item.name} (Rp ${price})`;
            })
            .join('\n');

        const total = order.total_price.toLocaleString('id-ID');

        const messageWithDetails = `Halo ${customerName || 'Pelanggan'},
Berikut detail pesanan Anda (#${order.id.toString().padStart(3, '0')}):

${itemsList}

Total: Rp ${total}

Terima kasih telah berbelanja di DuStore!`;

        const encodedMessage = encodeURIComponent(messageWithDetails);

        window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
        setOpen(false);
        toast.success("Membuka WhatsApp dengan detail pesanan...");
    };

    return (
        <div className="flex gap-2">
            {/* <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => generatePDF()}
                title="Download Struk PDF"
            >
                <Download className="h-4 w-4" />
            </Button> */}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        title="Kirim ke WhatsApp"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kirim Struk via WhatsApp</DialogTitle>
                        <DialogDescription>
                            Masukkan nama pelanggan dan nomor WhatsApp.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nama
                            </Label>
                            <Input
                                id="name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Nama Pelanggan"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                No. WA
                            </Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="08..."
                                className="col-span-3"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="pdf"
                                checked={includePDF}
                                onCheckedChange={(c) => setIncludePDF(c === true)}
                            />
                            <Label htmlFor="pdf" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Unduh struk PDF
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSendWA}>Kirim</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export const columns: ColumnDef<Order>[] = [
    {
        accessorKey: "id",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    No ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const id = row.getValue("id") as number;
            return <div className="font-medium">{id.toString().padStart(3, '0')}</div>;
        },
    },
    {
        id: "items",
        header: "Menu Pesanan",
        cell: ({ row }) => {
            const items = row.original.order_items;
            const itemNames = items.length > 0
                ? items.map(item => `${item.name} (${item.quantity})`).join(", ")
                : "No items";

            return (
                <div className="max-w-[300px] truncate text-muted-foreground" title={itemNames}>
                    {itemNames}
                </div>
            );
        },
    },
    {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => {
            const val = row.getValue("created_at");
            if (!val) return "-";
            const date = new Date(val as string);
            return <div>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>;
        },
    },
    {
        accessorKey: "total_price",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("total_price"));
            const formatted = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(amount);
            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        id: "actions",
        header: "Struk & WA",
        cell: ({ row }) => <OrderActions order={row.original} />,
    },
];

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isLoading?: boolean;
}

export function OrdersDataTable<TData, TValue>({
    columns,
    data,
    isLoading,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                {columns.map((_, index) => (
                                    <TableCell key={index}>
                                        <Skeleton className="h-6 w-full" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4 px-4 bg-muted/20">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
