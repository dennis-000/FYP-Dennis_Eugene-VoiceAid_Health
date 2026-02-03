import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface CalendarStripProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    colors: any;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({ selectedDate, onDateSelect, colors }) => {
    return (
        <View style={{ marginBottom: 20 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
                {Array.from({ length: 7 }, (_, i) => {
                    const today = new Date();
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay()); // Start Sunday
                    const d = new Date(startOfWeek);
                    d.setDate(d.getDate() + i);

                    const isSelected = selectedDate.toDateString() === d.toDateString();
                    const isToday = d.toDateString() === new Date().toDateString();
                    const dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
                    const dateLabel = d.getDate();

                    return (
                        <TouchableOpacity
                            key={i}
                            onPress={() => onDateSelect(new Date(d))}
                            style={{
                                paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center',
                                backgroundColor: isSelected ? colors.primary : colors.card,
                                borderRadius: 16, marginRight: 8,
                                borderWidth: 1, borderColor: isSelected ? colors.primary : colors.border,
                                minWidth: 50
                            }}
                        >
                            <Text style={{
                                color: isSelected ? '#FFF' : colors.subText,
                                fontSize: 11, marginBottom: 2, fontWeight: '600'
                            }}>
                                {dayLabel}
                            </Text>
                            <Text style={{
                                color: isSelected ? '#FFF' : colors.text,
                                fontSize: 16, fontWeight: 'bold'
                            }}>
                                {dateLabel}
                            </Text>
                            {isToday && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isSelected ? '#FFF' : colors.primary, marginTop: 4 }} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};
