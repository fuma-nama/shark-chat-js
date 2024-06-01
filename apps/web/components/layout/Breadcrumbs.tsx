import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, ReactNode } from "react";
import { tv } from "tailwind-variants";

export type BreadcrumbItemType = {
  id: string;
  text: ReactNode;
  href?: string;
};

const itemVariants = tv({
  base: "inline-flex items-center gap-2 font-medium text-sm",
});

export function Breadcrumbs({ items }: { items: BreadcrumbItemType[] }) {
  return (
    <div className="flex flex-row gap-1 items-center">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i !== 0 && <Separator />}
          {item.href ? (
            <Link href={item.href} className={itemVariants()}>
              {item.text}
            </Link>
          ) : (
            <div className={itemVariants()}>{item.text}</div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

function Separator() {
  return <ChevronRightIcon className="h-5 w-5 text-accent-800" />;
}
