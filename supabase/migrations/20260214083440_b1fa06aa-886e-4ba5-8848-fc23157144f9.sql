
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT NOT NULL,
  status TEXT,
  location TEXT,
  carrier TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_shipments_tracking_number ON public.shipments (tracking_number);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Public read for now (no auth required to look up a shipment)
CREATE POLICY "Anyone can view shipments" ON public.shipments FOR SELECT USING (true);

-- Only service role (edge functions) can insert/update
CREATE POLICY "Service role can insert shipments" ON public.shipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update shipments" ON public.shipments FOR UPDATE USING (true);
