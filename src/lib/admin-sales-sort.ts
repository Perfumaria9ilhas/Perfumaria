type Sale = { status: string; deliveryStatus: string; createdAt: string };
export function compareMobileSales(left: Sale, right: Sale) {
  const pending = (sale: Sale) => sale.status === "PENDING" || sale.deliveryStatus === "PENDING" ? 1 : 0;
  return pending(right) - pending(left) || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}
