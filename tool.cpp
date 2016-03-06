#include <iostream>
#include <string>
#include <vector>

using namespace std;

int main()
{
	char c;
	string map;
	vector <string> mapString;
	string t = "10";
	for (int r=0; r<12; r++)
	{
		cin>>c;
		
		cout<<c;
		switch(c)
		{
			case 'n':
				mapString.push_back("0");
				break;
			case 'b':
				mapString.push_back("1");
				break;
			case 'g':
				mapString.push_back("999");
				break;
			case 's':
				mapString.push_back("300");
				break;
			case '0' ... '9':
				t="10";
				t+=c;
				mapString.push_back(t);
				break;
			case 'q':
				mapString.push_back("201");
				break;
			case 'w':
				mapString.push_back("202");
				break;
			case 'e':
				mapString.push_back("203");
				break;
			case 'r':
				mapString.push_back("204");
				break;
			case 't':
				mapString.push_back("205");
				break;
			case 'y':
				mapString.push_back("206");
				break;
			case 'u':
				mapString.push_back("207");
				break;				
			case 'i':
				mapString.push_back("208");
				break;
			case 'o':
				mapString.push_back("209");
				break;								
			case 'p':
				mapString.push_back("200");
				break;				
			default:
				cout<<"\ninvaild code\n";
		}
	}

	map="\n\n[";
	for (int r=0; r<12; r++)
	{
		map+=mapString[r];
		if(r<11)
			map+=", ";
		else
			map+="]\n";
	}

	cout<<map;
	return 0;
}