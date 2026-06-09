import { supabase } from "./connection.js";

async function currentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---- Decks -----------------------------------------------------------------

// Decks, each annotated with { total, due } card counts.
export async function listDecks() {
  const [{ data: decks, error: decksErr }, { data: cards, error: cardsErr }] =
    await Promise.all([
      supabase.from("decks").select("*").order("created_at", { ascending: true }),
      supabase.from("cards").select("deck_id, next_review"),
    ]);
  if (decksErr) throw decksErr;
  if (cardsErr) throw cardsErr;

  const stats = {};
  for (const c of cards) {
    const s = (stats[c.deck_id] ??= { total: 0, due: 0 });
    s.total += 1;
    if (c.next_review <= today()) s.due += 1;
  }

  return decks.map((d) => ({
    ...d,
    total: stats[d.id]?.total ?? 0,
    due: stats[d.id]?.due ?? 0,
  }));
}

export async function createDeck(name) {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("decks")
    .insert({ user_id, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDeck(id, name) {
  const { error } = await supabase.from("decks").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteDeck(id) {
  // Cards are removed automatically via ON DELETE CASCADE.
  const { error } = await supabase.from("decks").delete().eq("id", id);
  if (error) throw error;
}

// ---- Cards -----------------------------------------------------------------

export async function listCards(deckId) {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCard(deckId, front, back) {
  const user_id = await currentUserId();
  const { error } = await supabase
    .from("cards")
    .insert({ user_id, deck_id: deckId, front, back });
  if (error) throw error;
}

export async function updateCard(id, front, back) {
  const { error } = await supabase
    .from("cards")
    .update({ front, back })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCard(id) {
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}

// Cards due for review today (or overdue). Pass a deckId to scope to one deck,
// or omit it to pull due cards across every deck.
export async function dueCards(deckId) {
  let query = supabase
    .from("cards")
    .select("*")
    .lte("next_review", today())
    .order("next_review", { ascending: true });
  if (deckId) query = query.eq("deck_id", deckId);

  const { data, error } = await query;
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
