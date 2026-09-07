import React from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { Input } from '../../../components/base/Input';
import { Button } from '../../../components/base/Button';
import { Avatar } from '../../../components/base/Avatar';
import { Alert } from '../../../components/composite/Alert';

export interface ProfileEditorProps {
  fullName: string;
  avatarUrl: string;
  email: string;
  onSave: (data: { fullName: string; avatar: string }) => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  error?: string;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  fullName: initialFullName,
  avatarUrl: initialAvatarUrl,
  email,
  onSave,
  isLoading = false,
  isSuccess = false,
  error,
}) => {
  const [fullName, setFullName] = React.useState(initialFullName);
  const [avatarUrl, setAvatarUrl] = React.useState(initialAvatarUrl);

  React.useEffect(() => {
    setFullName(initialFullName);
    setAvatarUrl(initialAvatarUrl);
  }, [initialFullName, initialAvatarUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ fullName, avatar: avatarUrl });
  };

  return (
    <Card variant="default">
      <CardHeader>
        <h3 className="text-base font-bold font-display text-[var(--color-text-primary)]">
          Personal Details & Avatar
        </h3>
      </CardHeader>

      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)]">
            <Avatar name={fullName || email} src={avatarUrl} size="lg" />
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
                {fullName || 'User Avatar'}
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)] block">
                {email}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              fullWidth
              required
            />

            <Input
              label="Email Address (Read Only)"
              value={email}
              disabled
              fullWidth
            />

            <Input
              label="Avatar Image URL"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              helperText="Provide a direct URL to an avatar image."
              fullWidth
            />
          </div>

          {isSuccess && (
            <Alert variant="success" title="Success">
              Profile updated successfully.
            </Alert>
          )}

          {error && (
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          )}

          <div className="pt-2 flex justify-end gap-3">
            {(fullName !== initialFullName || avatarUrl !== initialAvatarUrl) && (
              <Button
                type="button"
                variant="subtle"
                size="md"
                onClick={() => {
                  setFullName(initialFullName);
                  setAvatarUrl(initialAvatarUrl);
                }}
              >
                Reset Changes
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

ProfileEditor.displayName = 'ProfileEditor';
