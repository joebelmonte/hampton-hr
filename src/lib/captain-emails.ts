const emailPattern = /^\S+@\S+\.\S+$/;

export function captainEmails(value: string) {
  const emails = value.split(",").map((email) => email.trim().toLowerCase());
  if (!emails.length || emails.some((email) => !emailPattern.test(email))) {
    throw new Error("Enter one or more valid captain email addresses, separated by commas.");
  }
  return [...new Set(emails)];
}

export function normalizeCaptainEmails(value: string) {
  return captainEmails(value).join(", ");
}
