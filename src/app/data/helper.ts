import { PayloadAction } from '@reduxjs/toolkit';
import { GitLabState } from './gitLabSlice/types';

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

export function updateState<DataType, DataIdType, AssociatedIdType>(
  newData: DataType[],
  stateData: DataType[],
  associationId: AssociatedIdType,
  associationMap: Map<AssociatedIdType, DataIdType[]>,
  getId: GetIdFunctionType<DataType, DataIdType>,
  equals: EqualFunctionType<DataType>,
): void {
  // Upsert every item into the state
  newData.forEach(newItem => {
    // check if list has item, if not just add the item
    const existingItemIdx = stateData.findIndex(i => equals(i, newItem));
    if (existingItemIdx === -1) {
      stateData.push(newItem);
    } else {
      // return a new list that has the new item replace the old one
      stateData[existingItemIdx] = newItem;
    }
  });
  // update the assoicated map
  associationMap.set(associationId, newData.map(getId));
}

export function removeFromState<IdType, DataType>(
  removeItems: DataType[],
  stateData: DataType[],
  associationId: IdType,
  associationMap: Map<IdType, DataType>,
  equals: EqualFunctionType<DataType>,
): void {
  // Check if the state contains anything at all
  if (stateData.length <= 0) {
    return;
  }
  removeItems.forEach(removeItem => {
    const existingItemIdx = stateData.findIndex(i => equals(i, removeItem));
    if (existingItemIdx !== -1) {
      stateData.splice(existingItemIdx, 1);
    }
  });
  // Clear the associated map as well
  associationMap.delete(associationId);
}

export function removeFromStateByIdentifier<
  DataType,
  DataIdType,
  AssociatedIdType,
>(
  items: DataType[],
  associationMap: Map<AssociatedIdType, DataIdType[]>,
  associatedId: AssociatedIdType,
  getId: GetIdFunctionType<DataType, DataIdType>,
  except?: (item: DataType) => boolean,
): DataType[] {
  if (!associationMap.has(associatedId)) return items; // can't do anything if we don't know what to remove
  if (!items || items.length <= 0) {
    associationMap.delete(associatedId);
    return [];
  }
  // get a list of all items to remove via the associatedMap
  const itemIdsToRemove = associationMap.get(associatedId);
  if (!itemIdsToRemove || itemIdsToRemove.length <= 0) {
    associationMap.delete(associatedId);
    return items;
  }
  // Remove them from the list and from the map
  items = items.filter(
    item => (except && except(item)) || !itemIdsToRemove.includes(getId(item)),
  );
  associationMap.delete(associatedId);
  return items;
}

export type EqualFunctionType<DataType> = (a: DataType, b: DataType) => boolean;
export type GetIdFunctionType<DataType, DataIdType> = (
  a: DataType,
) => DataIdType;

export const equalByAttribute =
  <DataType>(attributeName: string): EqualFunctionType<DataType> =>
  (a: DataType, b: DataType) =>
    a[attributeName] === b[attributeName];

export const getIdByAttribute = <DataType, DataIdType>(
  attributeName: string,
): GetIdFunctionType<DataType, DataIdType> => {
  return (a: DataType) => a[attributeName];
};

export function createSettingReducer<DataType, DataIdType, AssociatedIdType>(
  stateAttribute: string,
  stateMapAttribute: string,
  dataIdAttribute: string,
): (
  state: GitLabState,
  action: PayloadAction<{ items: DataType[]; assoicatedId: AssociatedIdType }>,
) => void {
  return (state, action) => {
    const { items, assoicatedId } = action.payload;
    updateState<DataType, DataIdType, AssociatedIdType>(
      items,
      state[stateAttribute],
      assoicatedId,
      state[stateMapAttribute],
      getIdByAttribute(dataIdAttribute),
      equalByAttribute(dataIdAttribute),
    );
  };
}
