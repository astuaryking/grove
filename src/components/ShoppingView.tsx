"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { useAppState, useAppDispatch, useCurrentUser, newId } from "@/lib/context";
import type { ShoppingItem, User } from "@/lib/types";

export default function ShoppingView() {
  const state       = useAppState();
  const dispatch    = useAppDispatch();
  const currentUser = useCurrentUser();

  const [adding,        setAdding]        = useState(false);
  const [newName,       setNewName]       = useState("");
  const [newQty,        setNewQty]        = useState("1");
  const [newUnit,       setNewUnit]       = useState("");
  const [newStore,      setNewStore]      = useState("");
  const [newAssignees,  setNewAssignees]  = useState<string[]>([]);
  const [newNotes,      setNewNotes]      = useState("");
  const [showPurchased, setShowPurchased] = useState(false);

  const items      = state.data.shoppingList;
  const users      = state.data.users;
  const unpurchased = items.filter((i) => !i.purchased);
  const purchased   = items.filter((i) => i.purchased);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const item: ShoppingItem = {
      id:         newId("shop"),
      name,
      qty:        parseInt(newQty) || 1,
      unit:       newUnit.trim(),
      store:      newStore.trim(),
      assignees:  newAssignees,
      notes:      newNotes.trim(),
      purchased:  false,
      createdAt:  new Date().toISOString(),
    };
    dispatch({ type: "ADD_SHOPPING_ITEM", item });
    setNewName(""); setNewQty("1"); setNewUnit(""); setNewStore(""); setNewAssignees([]); setNewNotes("");
    setAdding(false);
  }

  function toggleAssignee(userId: string) {
    setNewAssignees((prev) =>
      prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId]
    );
  }

  function togglePurchased(itemId: string) {
    if (!currentUser) return;
    dispatch({ type: "TOGGLE_PURCHASED", itemId, userId: currentUser.id });
  }

  function deleteItem(itemId: string) {
    dispatch({ type: "DELETE_SHOPPING_ITEM", itemId });
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground">To Buy</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {unpurchased.length} item{unpurchased.length !== 1 ? "s" : ""} remaining
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors"
          >
            <Plus size={12} /> Add item
          </button>
        )}
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-4 max-w-2xl">
        {/* Inline add form */}
        {adding && (
          <form onSubmit={handleAdd} className="bg-panel border border-border rounded p-3 flex flex-col gap-2.5">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setAdding(false); }}
              placeholder="Item name"
              className="text-[13px] bg-transparent border-b border-border pb-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring w-full"
            />
            <div className="flex gap-2 flex-wrap">
              <input
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="Qty"
                className="text-[12px] bg-surface border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring w-14"
              />
              <input
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="Unit (bags, lbs…)"
                className="text-[12px] bg-surface border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring flex-1 min-w-[100px]"
              />
              <input
                value={newStore}
                onChange={(e) => setNewStore(e.target.value)}
                placeholder="Store (Agway, Amazon…)"
                className="text-[12px] bg-surface border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring flex-1 min-w-[120px]"
              />
            </div>
            {users.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground mr-0.5">Assign:</span>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className="text-[11px] px-1.5 py-0.5 rounded-sm font-medium transition-colors"
                    style={
                      newAssignees.includes(u.id)
                        ? { backgroundColor: u.color + "33", color: u.color, border: `1px solid ${u.color}66` }
                        : { backgroundColor: "transparent", color: "#888", border: "1px solid #333" }
                    }
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            )}
            <input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="text-[12px] bg-surface border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring w-full"
            />
            <div className="flex gap-2 justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-[12px] bg-primary text-primary-foreground rounded px-3 py-1 font-medium hover:opacity-90"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* Unpurchased */}
        {unpurchased.length === 0 && !adding && (
          <p className="text-[13px] text-muted-foreground">Nothing to buy. Add an item above.</p>
        )}
        {unpurchased.length > 0 && (
          <div className="flex flex-col border border-border rounded overflow-hidden">
            {unpurchased.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                users={users}
                onToggle={() => togglePurchased(item.id)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {/* Purchased */}
        {purchased.length > 0 && (
          <div>
            <button
              onClick={() => setShowPurchased((p) => !p)}
              className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-1.5 flex items-center gap-1"
            >
              Purchased ({purchased.length})
              <span className="text-[10px]">{showPurchased ? "▲" : "▼"}</span>
            </button>
            {showPurchased && (
              <div className="flex flex-col border border-border rounded overflow-hidden opacity-50">
                {purchased.map((item) => (
                  <ShoppingRow
                    key={item.id}
                    item={item}
                    users={users}
                    onToggle={() => togglePurchased(item.id)}
                    onDelete={() => deleteItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ShoppingRow({
  item,
  users,
  onToggle,
  onDelete,
}: {
  item: ShoppingItem;
  users: User[];
  onToggle: () => void;
  onDelete: () => void;
}) {
  const assignedUsers = users.filter((u) => item.assignees.includes(u.id));
  const purchasedBy   = item.purchasedBy ? users.find((u) => u.id === item.purchasedBy) : null;

  return (
    <div className="group flex items-center gap-2.5 px-3 py-[7px] border-b border-border last:border-b-0 hover:bg-raised transition-colors">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-[15px] h-[15px] rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
          item.purchased ? "bg-primary border-primary" : "border-border-emphasized hover:border-ring"
        }`}
      >
        {item.purchased && <Check size={9} className="text-primary-foreground" strokeWidth={3} />}
      </button>

      {/* Name + qty + unit */}
      <span className={`flex-1 text-[13px] min-w-0 truncate ${item.purchased ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {(item.qty > 1 || item.unit) && (
          <span className="font-mono text-muted-foreground tabular-nums mr-1.5 text-[12px]">
            {item.qty}{item.unit ? ` ${item.unit}` : ""}
          </span>
        )}
        {item.name}
      </span>

      {/* Store */}
      {item.store && (
        <span className="text-[11px] text-muted-foreground hidden sm:inline flex-shrink-0">{item.store}</span>
      )}

      {/* Assignee badges */}
      {assignedUsers.length > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {assignedUsers.map((u) => (
            <span
              key={u.id}
              className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium"
              style={{ color: u.color, backgroundColor: u.color + "22" }}
            >
              {u.name}
            </span>
          ))}
        </div>
      )}

      {/* Who purchased it */}
      {purchasedBy && (
        <span className="text-[11px] font-mono flex-shrink-0" style={{ color: purchasedBy.color }}>
          ✓ {purchasedBy.name}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
      >
        <X size={11} />
      </button>
    </div>
  );
}
