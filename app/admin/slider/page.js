import { getSliders } from "@/lib/content";
import SliderClient from "@/components/admin/SliderClient";

export default function AdminSliderPage() {
  const items = getSliders();
  return <SliderClient initial={items} />;
}
