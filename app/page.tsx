import { Utensils, Search } from "@/components/Icons";

export default async function Page() {
  return (
    <section className="w-screen h-screen flex flex-col items-center py-12 sm:py-30">
      <Utensils />
      <h1 className="text-xl sm:text-3xl text-center mt-5 sm:mt-6">
        Welcome to your recipe collection
      </h1>
      <h2 className="text-[14px] sm:text-xl font-light text-center mt-2 sm:mt-0 mx-15">
        Create and organize your favorite recipes in one place.
      </h2>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-x-6.25 gap-y-8.5 mt-10">
        <div className="flex items-center gap-x-1 sm:gap-x-2 px-12.5 py-1.75 light border-styles h-10 sm:h-12.5">
          <Search />
          <a className="text-[16px] sm:text-2xl text-center" href="/find">
            Find Recipe
          </a>
        </div>
        <a
          className="px-12.5 py-1.75 sm:py-1.5 text-[16px] sm:text-2xl dark border-styles text-center"
          href="/add"
        >
          + Add Recipe
        </a>
      </div>
    </section>
  );
}

// //
//   title: "Welcome to your recipe collection",
//   description: "Create and organize your favorite recipes in one place.",
