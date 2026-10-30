import { Suspense } from "react";
import PetitionPage from "@/components/petition-page";
import { petitionMetadata } from "@/lib/petition-metadata";

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return petitionMetadata(Promise.resolve({ petition: id }), {
    title: "Campus petition",
  });
}
async function Content({ params }: Props) {
  const { id } = await params;
  return <PetitionPage id={id} />;
}
export default function Page(props: Props) {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="page-loading" role="status">
          Loading petition…
        </main>
      }
    >
      <Content {...props} />
    </Suspense>
  );
}
