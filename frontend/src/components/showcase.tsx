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
                    {items.map((item, index) => (
                        <CarouselItem
                            key={index}
                            className="lg:basis-1/3 md:basis-1/2 sm:basis-full flex justify-center"
                        >
                            <div
                                className="aspect-square w-[300px] cursor-pointer"
                                onClick={() => onItemClick(item)}
                            >
                                <Card className="h-full w-full">
                                    <CardContent className="flex items-center justify-center h-full">
                                        <span className="text-2xl font-semibold">{item}</span>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
