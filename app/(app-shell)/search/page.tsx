"use client";

import { useContext } from "react";
import { SearchContext } from "@/context/search-context";
import SearchResults from "@/components/search-results";

export default function SearchPage() {
  const { searchQuery } = useContext(SearchContext) ?? { searchQuery: "" };

  return (
    <div className="p-6">
      <SearchResults query={searchQuery} />
    </div>
  );
}
