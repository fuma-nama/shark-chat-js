import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, ReactNode } from "react";
import { useRouter } from "next/router";

export type BreadcrumbItemType = {
  text: string | ReactNode;
  href: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItemType[] }) {
  const query = useRouter().query;

  return (
    <div className="flex flex-row gap-1 items-center">
      {items.map((item, i) => (
        <Fragment key={item.href}>
          {i !== 0 && <Separator />}
          <Link
            href={{ pathname: item.href, query }}
            className="font-medium text-sm"
          >
            {item.text}
          </Link>
        </Fragment>
      ))}
    </div>
  );
}

function Separator() {
  return <ChevronRightIcon className="h-5 w-5 text-accent-800" />;
}
