import ClaudeChatRoom from "./components/ClaudeChatRoom";
import { auth } from "@/auth";
import SignIn from "./components/sign-in";
export default async function Home() {
  const session = await auth();
  return <>{session ? <ClaudeChatRoom></ClaudeChatRoom> : <SignIn></SignIn>}</>;
}
