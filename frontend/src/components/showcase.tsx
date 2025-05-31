import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Card, CardContent } from '@/components/ui/card';



export function Showcase() {
    const items = Array.from({ length: 10 }, (_, index) => `Item ${index + 1}`);
    const onItemClick = (item) => {
        console.log(`Clicked on ${item}`);
    };

    if (!items || items.length === 0) {
        return <div>No items to display</div>;
    }

    return (
        <div className="h-full w-full"> 
            <Carousel className="w-full">
                <CarouselContent>
                {Array.from({ length: items.length }, (_, index) => (
                    <CarouselItem key={index} className=" lg:basis-1/2">
                        <div className="p-1" onClick={() => onItemClick(items[index])}>
                            <Card>
                                <CardContent className="flex items-center justify-center p-4">
                                    <span className="text-2xl font-semibold">{index + 1}</span>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))
                }
                </CarouselContent>
            </Carousel>
        </div>
    );
}