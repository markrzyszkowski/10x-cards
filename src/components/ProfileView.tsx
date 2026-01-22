import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProfileViewProps {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
}

export function ProfileView({ user }: ProfileViewProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== user.email) {
      setError("Email does not match");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete account. Please try again");
        setIsDeleting(false);
        return;
      }

      // Account successfully deleted - redirect to register page
      window.location.href = "/register";
    } catch (err) {
      console.error("Account deletion error:", err);
      setError("An unexpected error occurred. Please try again");
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Member since</label>
            <p className="text-sm text-muted-foreground">{formatDate(user.created_at)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">User ID</label>
            <p className="text-sm text-muted-foreground font-mono text-xs">{user.id}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanent actions that cannot be undone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showDeleteConfirmation ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirmation(true)}
              >
                Delete Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All flashcards</li>
                    <li>Generation history</li>
                    <li>Account information</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <label htmlFor="confirmEmail" className="text-sm font-medium block">
                  Type <span className="font-mono font-bold">{user.email}</span> to confirm
                </label>
                <Input
                  id="confirmEmail"
                  type="text"
                  placeholder={user.email}
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  disabled={isDeleting}
                  aria-invalid={!!error}
                  className="mt-3"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmationText !== user.email || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "I understand, delete my account"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setDeleteConfirmationText("");
                    setError(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}