export type CargoItem = {
  item: string;
  weight_kg: number;
};

export type Shipment = {
  id: string;
  status: string;
  cargo_details: CargoItem[] | null;
};
