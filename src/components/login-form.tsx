import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import { toast } from "sonner";
// import { useAuthStore } from "@/lib/store/auth";
import { useLoginMutation } from "@/lib/Auth/useLoginMutation";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("yijawi8681@ixospace.com");
  const [password, setPassword] = useState("12345678");
  // const navigate = useNavigate(); // handled in mutation
  const useLogin = useLoginMutation();
  // const setUser = useAuthStore((s) => s.setUser); // handled in mutation
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    useLogin.mutate(
      { email, password },
      {
        onSuccess: (user: User) => {
          toast.success(`Selamat datang, ${user.name}!`);
        },
        onError: (err: Error) => {
          toast.error(err.message);
        },
      }
    );
  };

  return (
    <div
      className={cn(
        "flex min-h-screen w-full px-4 py-8 justify-center items-center",
        className
      )}
      {...props}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                {/* <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/registration"
                    className="underline underline-offset-4"
                  >
                    Sign up
                  </Link>
                </FieldDescription> */}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
