"use client";

import { useContext } from "react";
import SearchResults from "@/components/search-results";
import { SearchContext } from "@/context/search-context";

export default function SearchPage() {
	const { searchQuery } = useContext(SearchContext) ?? { searchQuery: "" };

	return (
		<div className="p-6">
			<SearchResults query={searchQuery} />
		</div>
	);
}
