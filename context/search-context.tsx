import React, { createContext } from "react";

export interface SearchContextType {
	searchQuery: string;
	setSearchQuery: (q: string) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(
	undefined,
);
