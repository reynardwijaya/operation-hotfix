"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function updateShipmentStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from("shipments")
    .update({ status })
    .eq("id", id)
    .select();

  console.log("[SERVER] Attempted update:", { id, status });
  console.log("[SERVER] Supabase error:", error);
  console.log("[SERVER] Updated rows:", data);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");

  return { success: true };
}
