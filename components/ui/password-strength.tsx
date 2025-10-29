export interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };

  Object.values(checks).forEach(check => {
    if (check) strength++;
  });

  const strengthText = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColor = [
    "bg-error",
    "bg-warning",
    "bg-primary",
    "bg-success",
    "bg-success",
  ];
  const strengthLabel = strengthText[strength] || "Very Weak";
  const colorClass = strengthColor[strength] || "bg-error";

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? colorClass : "bg-glass-light dark:bg-glass-dark"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
        Strength: <span className={`font-medium ${colorClass === "bg-error" ? "text-error" : colorClass === "bg-warning" ? "text-warning" : colorClass === "bg-success" ? "text-success" : "text-primary"}`}>{strengthLabel}</span>
      </p>
    </div>
  );
}
