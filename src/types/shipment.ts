export type Shipment = {
  id: string;
  created_at: string;
  status: string;
  cargo_details: {
    item: string;
    weight_kg: number;
  } | null;
};
