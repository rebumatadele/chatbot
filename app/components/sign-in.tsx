import Image from "next/image";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import my_image from "@/public/ai image.jpg";
export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
      className="flex items-center justify-center"
    >
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-[#F8F8F8]">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Unlock Your Digital Potential
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Discover our cutting-edge solutions and transform your business
                with our innovative platform.
              </p>
              <Button type="submit">Signin with Google</Button>
            </div>
            <div className="hidden md:block">
              <Image
                src={my_image}
                width={600}
                height={400}
                alt="Hero Image"
                className="mx-auto rounded-xl"
                layout="responsive"
                objectFit="cover"
                placeholder="blur"
              />
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
