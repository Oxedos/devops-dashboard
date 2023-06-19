/**
 * Add a new item to a list or update the item if it is already in the list
 * @param list The list to update
 * @param newItems The new items to upsert
 * @param isEqual A function that determines if two objects in the list are equal
 * @returns The new list
 */
export const upsert = (
  list: any[],
  newItems: any[],
  isEqual: (arg1: any, arg2: any) => boolean,
) => {
  // add item to list if list is empty
  if (list.length <= 0) {
    return [...newItems];
  }
  const newList = list.slice();
  newItems.forEach(newItem => {
    // check if list has item, if not just add the item
    const existingItemIdx = newList.findIndex(i => isEqual(i, newItem));
    if (existingItemIdx === -1) {
      newList.push(newItem);
    } else {
      // return a new list that has the new item replace the old one
      newList[existingItemIdx] = newItem;
    }
  });
  return newList;
};

/**
 * Remove items from a list
 * @param list The list to remove the items from
 * @param removeItems The items to remove
 * @param isEqual A function that compares two items from the lists and returns true if they are equal
 * @returns The list with the items removed from it
 */
export const remove = (
  list: any[],
  removeItems: any[],
  isEqual: (arg1: any, arg2: any) => boolean,
) => {
  // add item to list if list is empty
  if (list.length <= 0) {
    return [];
  }
  const newList = list.slice();
  removeItems.forEach(removeItem => {
    const existingItemIdx = newList.findIndex(i => isEqual(i, removeItem));
    if (existingItemIdx !== -1) {
      newList.splice(existingItemIdx, 1);
    }
  });
  return newList;
};
