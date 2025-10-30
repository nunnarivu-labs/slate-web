export type Tag = {
  id: string;
  name: string;
};

type UpdatedStatus = 'NEWLY_ADDED' | 'NEWLY_CREATED' | 'REMOVED';

export type TagWithUpdatedStatus = Tag & {
  status: UpdatedStatus;
};

export type TagWithStatus = Tag & {
  status: 'ALREADY_ADDED' | UpdatedStatus;
};

export type TagWithCheckedStatus = Tag & {
  checked: boolean;
};
