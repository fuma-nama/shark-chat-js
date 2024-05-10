import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, ReactNode } from "react";

export type BreadcrumbItemType = {
  id: string;
  text: string | ReactNode;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItemType[] }) {
  return (
    <div className="flex flex-row gap-1 items-center">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i !== 0 && <Separator />}
          {item.href ? (
            <Link href={item.href} className="font-medium text-sm">
              {item.text}
            </Link>
          ) : (
            <div className="font-medium text-sm">{item.text}</div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

function Separator() {
  return <ChevronRightIcon className="h-5 w-5 text-accent-800" />;
}
