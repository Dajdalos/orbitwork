export default function WorkspaceNotFound() {
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold">Workspace not found or you don’t have access</h1>
      <p className="mt-2 text-sm text-gray-600">
        Ask the owner to invite you, or create a new workspace.
      </p>
    </main>
  );
}
