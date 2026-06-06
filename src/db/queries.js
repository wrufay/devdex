import { supabase } from "./connection.js";

async function currentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

export async function listCards() {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCard(front, back) {
  const user_id = await currentUserId();
  const { error } = await supabase
    .from("cards")
    .insert({ user_id, front, back });
  if (error) throw error;
}

export async function deleteCard(id) {
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}

// Cards due for review today (or overdue).
export async function dueCards() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .lte("next_review", today)
    .order("next_review", { ascending: true });
  if (error) throw error;
  return data;
}

export async function applyReview(
  id,
  { repetitions, easeFactor, interval, nextReview }
) {
  const { error } = await supabase
    .from("cards")
    .update({
      repetitions,
      ease_factor: easeFactor,
      interval,
      next_review: nextReview,
    })
    .eq("id", id);
  if (error) throw error;
}
