import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';

export function BotSelector({ bots, handleSelectBot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {bots && bots.length > 0 ? (
        bots.map((bot) => (
          <Card
            key={bot.id}
            className="cursor-pointer transition-transform duration-200 hover:scale-105 custom-card"
            onClick={() => handleSelectBot(bot)}
          >
            <CardHeader className="p-4">
              <h2 className="text-xl font-semibold">{bot.fullname}</h2>
              <p className="text-sm text-gray-500">@{bot.username}</p>
            </CardHeader>
          </Card>
        ))
      ) : (
        <p className="text-center col-span-full">Магазины не найдены</p>
      )}
    </div>
  );
}

export default BotSelector;
