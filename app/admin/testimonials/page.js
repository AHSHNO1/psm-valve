import { getTestimonials } from "@/lib/content";
import TestimonialsClient from "@/components/admin/TestimonialsClient";

export default function AdminTestimonialsPage() {
  const items = getTestimonials();
  return <TestimonialsClient initial={items} />;
}
