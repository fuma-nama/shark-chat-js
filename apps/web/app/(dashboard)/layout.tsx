import { ReactNode } from "react";
import { Provider } from "./layout.client";
import "cropperjs/dist/cropper.css";
import CreateGroupModal from "@/components/modal/CreateGroupModal";
import JoinGroupModal from "@/components/modal/JoinGroupModal";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Provider>
      <CreateGroupModal />
      <JoinGroupModal />
      {children}
    </Provider>
  );
}
