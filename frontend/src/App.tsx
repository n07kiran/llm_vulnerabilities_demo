import { HomePage } from "./pages/HomePage";
import { VulnerabilityPage } from "./pages/VulnerabilityPage";
import { usePathname } from "./utils/navigation";

export function App() {
  const pathname = usePathname();
  const match = pathname.match(/^\/vulnerabilities\/([^/]+)$/);

  if (match) {
    return <VulnerabilityPage slug={decodeURIComponent(match[1])} />;
  }

  return <HomePage />;
}
