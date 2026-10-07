/** A section's anchor on its topic page, shared by the article and the contents column. */
export const sectionId = (topicId: string, index: number): string => `${topicId}-${index + 1}`;
