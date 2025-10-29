import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 text-text-muted-light dark:text-text-muted-dark opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}
