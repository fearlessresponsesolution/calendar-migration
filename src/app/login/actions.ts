"use server"
import { signIn } from "@/auth"

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/calendar" })
}

export async function resendSignIn(formData: FormData) {
  const email = formData.get("email") as string
  await signIn("resend", { email, redirectTo: "/calendar" })
}
