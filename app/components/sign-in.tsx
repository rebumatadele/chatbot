
import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("google")
      }}
    className="flex items-center justify-center"
    >
      <Button type="submit">Signin with Google</Button>
    </form>
  )
} 