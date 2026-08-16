"use client";

import { useState } from "react";
import { postJson } from "@/lib/api";

interface AddCategoryFormProps {
  onCreated: () => Promise<void>;
}

export default function AddCategoryForm({ onCreated }: AddCategoryFormProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      await postJson("/categories", {
        name,
      });

      await onCreated();

      setName("");
    } catch (err) {
      console.error("Failed to create category:", err);
      setError("Failed to create category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4">
      <div>
        <label className="field-label" htmlFor="category-name">
          Category Name
        </label>
        <input
          id="category-name"
          className="field-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add Category"}
      </button>
    </form>
  );
}
