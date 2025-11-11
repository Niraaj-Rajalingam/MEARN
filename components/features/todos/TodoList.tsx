export function TodoList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Add a new task..."
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Add
        </button>
      </div>

      <div className="space-y-2">
        {/* to-do items will go here */}
        <p className="text-sm text-muted-foreground text-center py-8">
          No tasks yet. Add one to get started!
        </p>
      </div>
    </div>
  );
}