export type Tag = {
  id: string;
  name: string;
};

export type TagWithStatus = Tag & {
  status: 'ALREADY_ADDED' | 'NEWLY_ADDED' | 'NEWLY_CREATED' | 'REMOVED';
};

export type TagWithCheckedStatus = Tag & {
  checked: boolean;
};
