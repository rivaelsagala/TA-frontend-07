declare module "@/components/ui/alert" {
    export const Alert: React.FC<React.HTMLAttributes<HTMLDivElement> & {
      variant?: "default" | "destructive"
    }>
    export const AlertDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>>
  }