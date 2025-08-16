export function getOptimalImageUrl(item, preferredIndex = 1, fallbackIndex = 0) {
  if (!item?.images?.length) return null;
  
  return item.images[preferredIndex]?.url || 
         item.images[fallbackIndex]?.url || 
         null;
}

export function getShowImageUrl(userShowItem) {
  if (!userShowItem?.show) return null;
  return getOptimalImageUrl(userShowItem.show);
}

export function getFirstItemImageUrl(items, getImageFn = getOptimalImageUrl) {
  if (!items?.length) return null;
  return getImageFn(items[0]);
}