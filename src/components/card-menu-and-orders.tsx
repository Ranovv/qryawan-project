import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconPlus, IconEyeOff, IconEye, IconEdit, IconUpload } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { getMenus, updateMenuVisibility, updateMenu, type Menu } from "@/lib/services/menuService"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClients"

interface CardImageProps {
  onAddToCart: (item: any) => void;
  mode?: 'admin' | 'display';
}

function EditMenuDialog({ menu, open, onOpenChange }: { menu: Menu, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState(menu.name)
  const [price, setPrice] = useState(menu.price.toString())
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(menu.image)
  const [isUploading, setIsUploading] = useState(false)
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (updatedMenu: Partial<Menu>) => updateMenu(menu.id, updatedMenu),
    onSuccess: () => {
      toast.success("Menu berhasil diperbarui")
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
    onError: (error) => {
      toast.error("Gagal memperbarui menu: " + error.message)
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) {
      toast.error("Nama dan harga harus diisi")
      return
    }

    let imageUrl = menu.image

    if (imageFile) {
      setIsUploading(true)
      try {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('menu-images')
          .getPublicUrl(filePath)

        imageUrl = data.publicUrl
      } catch (error: any) {
        toast.error("Gagal mengupload gambar: " + error.message)
        setIsUploading(false)
        return
      } finally {
        setIsUploading(false)
      }
    }

    mutate({
      name,
      price: Number(price),
      image: imageUrl,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
            <DialogDescription>
              Ubah detail menu di sini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`name-${menu.id}`} className="text-right">Nama</Label>
              <Input
                id={`name-${menu.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`price-${menu.id}`} className="text-right">Harga</Label>
              <Input
                id={`price-${menu.id}`}
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Gambar</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id={`image-${menu.id}`}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label htmlFor={`image-${menu.id}`} className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                    <IconUpload className="mr-2 h-4 w-4" />
                    {imageFile ? "Ganti Gambar" : "Ubah Gambar"}
                  </Label>
                </div>
                {previewUrl && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || isUploading}>
              {isUploading ? "Mengupload..." : (isPending ? "Simpan Perubahan" : "Simpan Perubahan")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ... (previous code)
import { Skeleton } from "@/components/ui/skeleton";

// ... (EditMenuDialog code)

export function CardImage({ onAddToCart, mode = 'display' }: CardImageProps) {
  const queryClient = useQueryClient()
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)

  const { data: menus, isLoading, error } = useQuery({
    queryKey: ['menus'],
    queryFn: getMenus,
  })

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: number; isVisible: boolean }) =>
      updateMenuVisibility(id, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      toast.success("Status menu berhasil diperbarui")
    },
    onError: (error) => {
      toast.error("Gagal memperbarui status menu: " + error.message)
    }
  })

  const handleToggleHidden = (id: number, currentVisibility: boolean) => {
    toggleVisibilityMutation.mutate({ id, isVisible: !currentVisibility })
  }

  if (isLoading) {
    return (
      <div className="flex flex-wrap p-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="relative mx-auto w-[200px] space-y-2">
            <Skeleton className="h-[120px] w-full rounded-t-lg rounded-b-none" />
            <div className="p-3 space-y-2 border border-t-0 rounded-b-lg">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) return <div className="p-4 text-center text-red-500">Error loading menu</div>

  const displayData = mode === 'display'
    ? menus?.filter(item => item.is_visible)
    : menus



  return (
    <div className="space-y-4">
      {editingMenu && (
        <EditMenuDialog
          menu={editingMenu}
          open={!!editingMenu}
          onOpenChange={(open) => !open && setEditingMenu(null)}
        />
      )}

      {/* {mode === 'admin' && hiddenCount > 0 && (
        <div className="flex justify-end px-2">
          <span className="text-sm text-muted-foreground mr-2">
            {hiddenCount} menu disembunyikan
          </span>
        </div>
      )} */}

      <div className="flex flex-wrap p-2 gap-4">
        {displayData?.map((item: Menu) => {
          const isHidden = !item.is_visible
          return (
            <Card
              key={item.id}
              className={cn(
                "relative mx-auto w-[250px] pt-0 group transition-all",
                mode === 'admin' && isHidden && ""
              )}
            >
              <img
                src={item.image || "https://placehold.co/200x120?text=No+Image"}
                alt={item.name}
                className="relative z-20 h-[120px] w-full object-cover rounded-t-lg"
              />
              <CardHeader className="p-3">
                <CardTitle className="text-sm">{item.name}</CardTitle>
                <CardDescription className="text-xs">
                  Rp {item.price.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardFooter className=" pt-0 gap-2">
                {mode === 'admin' ? (
                  <div className="flex flex-col w-full gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8 p-1"
                      onClick={() => setEditingMenu(item)}
                      title="Edit Menu"
                    >
                      <IconEdit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant={isHidden ? "secondary" : "default"}
                      size="sm"
                      className="flex-1 text-xs h-8 p-1"
                      onClick={() => handleToggleHidden(item.id, item.is_visible)}
                      disabled={toggleVisibilityMutation.isPending}
                    >
                      {isHidden ? (
                        <>
                          <IconEye className="w-3 h-3" /> Tampilkan
                        </>
                      ) : (
                        <>
                          <IconEyeOff className="w-3 h-3" /> Sembunyikan
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full h-8 cursor-pointer"
                    size="sm"
                    onClick={() => onAddToCart(item)}
                  >
                    <IconPlus className="w-4 h-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
