import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FEATURES, STEPS } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex flex-col pt-12">
      <div className="flex items-center justify-center gap-4 px-10">
        <section className="mt-15 mb-5 pb-12 space-y-10 md:space-y-20 px-5 sm:mx-10">
          <div className="container mx-auto mb-5 px-4 md:px-6 text-center space-y-3">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-500 border-yellow-300 p-1">Split smart. Stay friends.</Badge>
          </div>

          <h1 className="gradient-text mx-auto max-w-4xl text-4xl md:text-7xl text-center mb-4">
            The easiest way to track and split shared expenses.
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-400 text-white"
            >
              <Link href="/dashboard">Split Bill Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-yellow-500 border-yellow-300 hover:text-yellow-400 hover:bg-yellow-50"
            >
              <Link href="#how-it-works">Quick Guide
                <BookOpen className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
        <div className="container max-w-xl overflow-hidden hidden sm:block">
          <div className="p-1 aspect-[16/9]">
            <Image
              src="/banner.png"
              alt="banner"
              width={300}
              height={700}
              className="mx-auto object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <section id="features" className="bg-purple-100 pt-5 mb-5">
        <div className="container mx-auto mb-5 px-4 md:px-6 text-center">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-500 border-yellow-300 px-2 py-1">Features</Badge>
          <h2 className="gradient-text mt-2 text-2xl">Everything you need to split smarter</h2>
          <p className="mx-auto mt-1 max-w-[700px] text-gray-500 md:text-l/relaxed">From group creation to smart settlements, Splitx gives you all the tools to make expense sharing effortless.</p>

          <div className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-2">
            {FEATURES.map(({ title, image, description }) => (
              <Card
                key={title}
                className="flex lg:flex-row items-center space-y-4 p-6 text-center gap-3"
              >
                <Image src={image} alt={title} width={200} height={200} className="mb-0" priority />
                <div>
                  <h3 className="gradient-text font-bold">{title}</h3>
                  <p className="text-gray-500">{description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="pt-5 mb-5">
        <div className="container mx-auto mb-5 px-4 md:px-6 text-center">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-500 border-yellow-300 p-1">How It Works</Badge>
          <h2 className="gradient-text mt-2 text-2xl">Three steps and you’re all set</h2>
          <p className="mx-auto mt-1 max-w-[700px] text-gray-500 md:text-l/relaxed">Follow these steps and split smarter in only three moves. Settle up quickly and fairly, without the hassle.</p>

          <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-3">
            {STEPS.map(({ label, title, description }) => (
              <div className="flex flex-col items-center space-y-3"
                key={label}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-xl font-bold text-yellow-500">
                  {label}
                </div>
                <h3 className="text-lg text-yellow-500 font-bold">{title}</h3>
                <p className="text-gray-500 text-center text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t bg-purple-200 py-6 text-center text-sm text-muted-foreground">
        Made with 💜
      </footer>
    </div>
  );
}
