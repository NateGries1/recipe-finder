export default async function Page() {
  return (
    <section className="w-screen h-screen flex flex-col items-center justify-center gap-y-10">
      <a
        className="px-10 py-6 bg-violet-900 text-white rounded-full text-center"
        href="/find"
      >
        Find Recipe
      </a>
      <a
        className="px-10 py-6 bg-violet-900 text-white rounded-full text-center border"
        href="/add"
      >
        Add Recipe
      </a>
    </section>
  );
}
