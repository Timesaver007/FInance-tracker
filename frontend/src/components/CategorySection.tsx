import { useState } from "react";
import AddCategoryForm from "@/components/AddCategoryForm";
import { PlusIcon, TagIcon } from "@/components/icons";

interface CategorySectionProps {
  refreshAll: () => Promise<void>;
}

export default function CategorySection({ refreshAll }: CategorySectionProps) {
  const [showForm, setShowForm] = useState(false);

  // Refresh, then close the form. refreshAll swallows its own errors, so this
  // only runs after a successful create.
  async function handleCreated() {
    await refreshAll();
    setShowForm(false);
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">
          <TagIcon className="h-5 w-5 text-gray-400" />
          Categories
        </h2>

        <button className="btn-ghost" onClick={() => setShowForm(!showForm)}>
          {!showForm && <PlusIcon className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {showForm ? (
        <AddCategoryForm onCreated={handleCreated} />
      ) : (
        <p className="muted">Create categories to group your spending.</p>
      )}
    </section>
  );
}
