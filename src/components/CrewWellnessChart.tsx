import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CrewWellnessChartProps {
  crewName: string;
}

const CrewWellnessChart = ({ crewName }: CrewWellnessChartProps) => {
  // Generate sample data for the past 7 days
  const generateData = () => {
    const baseStress = Math.random() * 30 + 10;
    const baseMood = Math.random() * 30 + 60;
    const baseSleep = Math.random() * 20 + 70;
    
    return Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      stress: Math.max(0, Math.min(100, baseStress + (Math.random() - 0.5) * 20)),
      mood: Math.max(0, Math.min(100, baseMood + (Math.random() - 0.5) * 15)),
      sleep: Math.max(0, Math.min(100, baseSleep + (Math.random() - 0.5) * 10)),
    }));
  };

  const [data, setData] = useState(generateData());

  useEffect(() => {
    // Update data every 5 seconds
    const interval = setInterval(() => {
      setData(generateData());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="cosmic-glow">
      <CardHeader>
        <CardTitle className="text-lg">{crewName} - Wellness Metrics</CardTitle>
        <CardDescription>7-day trend analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="day" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px"
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Line 
              type="monotone" 
              dataKey="mood" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              name="Mood"
              dot={{ fill: "hsl(var(--success))", r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="stress" 
              stroke="hsl(var(--warning))" 
              strokeWidth={2}
              name="Stress"
              dot={{ fill: "hsl(var(--warning))", r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="sleep" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Sleep Quality"
              dot={{ fill: "hsl(var(--primary))", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CrewWellnessChart;
