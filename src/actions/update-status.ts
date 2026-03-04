"use server"

import { revalidatePath } from "next/cache"
import { supabase } from "@/lib/supabase"

export async function updateShipmentStatus(id: string, status: string) {
  supabase.from("shipments").update({ status }).eq("id", id)
  revalidatePath("/dashboard")
}
