import { trpc } from "./trpc";

export default async function Home() {
  const res = await trpc.hello.query({ name: "Kaung Khant Thar" });
  return <div>{res}</div>;
}
