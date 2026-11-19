import { OrganizationAccessConsole } from "@/components/auth/OrganizationAccessConsole";
import { PlatformAccountSecurityConsole } from "@/components/auth/PlatformAccountSecurityConsole";

export default function PortalAccessPage(){
 return <main className="mx-auto min-h-screen max-w-6xl space-y-8 px-5 py-10">
  <OrganizationAccessConsole/>
  <PlatformAccountSecurityConsole/>
 </main>;
}
